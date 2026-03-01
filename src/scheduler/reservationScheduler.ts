import { Op, Transaction } from "sequelize";
import { Reservation, Drop } from "../models";
import { getIO } from "../socket";
import { SOCKET_EVENTS } from "../lib/constants/utils.constants";
import sequelize from "../lib/config/database";

const CHECK_INTERVAL = 5 * 1000; // check every 5 seconds

export const startReservationScheduler = () => {
  console.log("reservation expiry scheduler started");

  // prevent overlapping runs - setInterval doesnt wait for async to finish
  let isRunning = false;

  setInterval(async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      // find all active reservations that have expired
      const expiredReservations = await Reservation.findAll({
        where: {
          status: "active",
          expiresAt: { [Op.lt]: new Date() },
        },
      });

      if (expiredReservations.length === 0) return;

      for (const reservation of expiredReservations) {
        const t = await sequelize.transaction({
          isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
        });
        try {
          // re-fetch to be sure
          const freshReservation = await Reservation.findByPk(reservation.id, {
            transaction: t,
            lock: Transaction.LOCK.UPDATE,
          });

          if (!freshReservation || freshReservation.status !== "active") {
            await t.commit();
            continue; // already handled
          }

          // mark as expired
          freshReservation.status = "expired";
          await freshReservation.save({ transaction: t });

          // lock the drop row too so we dont conflict with concurrent reserves
          const drop = await Drop.findByPk(freshReservation.dropId, {
            transaction: t,
            lock: Transaction.LOCK.UPDATE,
          });
          if (drop) {
            drop.availableStock += 1;
            await drop.save({ transaction: t });

            await t.commit();

            // scoket
            const io = getIO();
            io.emit(SOCKET_EVENTS.INVENTORY_UPDATE, {
              dropId: drop.id,
              availableStock: drop.availableStock,
            });
            io.emit(SOCKET_EVENTS.RESERVATION_UPDATE, {
              reservationId: freshReservation.id,
              dropId: drop.id,
              userId: freshReservation.userId,
              availableStock: drop.availableStock,
            });

            console.log(
              `reservation ${freshReservation.id} expired, stock returned for drop ${drop.id}`,
            );
          } else {
            await t.commit();
          }
        } catch (err) {
          await t.rollback();
          console.error("error expiring reservation:", err);
        }
      }
    } catch (err) {
      console.error("scheduler error:", err);
    } finally {
      isRunning = false;
    }
  }, CHECK_INTERVAL);
};
