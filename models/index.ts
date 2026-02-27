import User from "./User";
import Drop from "./Drop";
import Reservation from "./Reservation";
import Purchase from "./Purchase";

// associations
User.hasMany(Reservation, { foreignKey: "userId" });
Reservation.belongsTo(User, { foreignKey: "userId" });

User.hasMany(Purchase, { foreignKey: "userId" });
Purchase.belongsTo(User, { foreignKey: "userId" });

Drop.hasMany(Reservation, { foreignKey: "dropId" });
Reservation.belongsTo(Drop, { foreignKey: "dropId" });

Drop.hasMany(Purchase, { foreignKey: "dropId" });
Purchase.belongsTo(Drop, { foreignKey: "dropId" });

Reservation.hasOne(Purchase, { foreignKey: "reservationId" });
Purchase.belongsTo(Reservation, { foreignKey: "reservationId" });

export { User, Drop, Reservation, Purchase };
