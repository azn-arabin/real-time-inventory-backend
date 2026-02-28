import { Op } from "sequelize";
import { Reservation, Drop } from "../models";
import { getIO } from "../socket";
import sequelize from "../lib/config/database";

const CHECK_INTERVAL = 10 * 1000; // check every 10 seconds

export const startReservationScheduler = () => {
  console.log("reservation expiry scheduler started");

  setInterval(async () => {
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
        const t = await sequelize.transaction();
        try {
          // mark as expired
          reservation.status = "expired";
          await reservation.save({ transaction: t });

          // return stock to the drop
          const drop = await Drop.findByPk(reservation.dropId, {
            transaction: t,
          });
          if (drop) {
            drop.availableStock += 1;
            await drop.save({ transaction: t });

            await t.commit();

            // notify all clients about stock change + expired reservaton
            const io = getIO();
            io.emit("stock-update", {
              dropId: drop.id,
              availableStock: drop.availableStock,
            });
            io.emit("reservation-expired", {
              reservationId: reservation.id,
              dropId: drop.id,
              userId: reservation.userId,
              availableStock: drop.availableStock,
            });

            console.log(
              `reservation ${reservation.id} expired, stock returned for drop ${drop.id}`,
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
    }
  }, CHECK_INTERVAL);
};
