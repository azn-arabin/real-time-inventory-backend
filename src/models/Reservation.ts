import { DataTypes, Model } from "sequelize";
import sequelize from "../lib/config/database";

class Reservation extends Model {
  declare id: string;
  declare userId: string;
  declare dropId: string;
  declare status: "active" | "completed" | "expired";
  declare expiresAt: Date;
}

Reservation.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    dropId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "completed", "expired"),
      defaultValue: "active",
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "reservations",
    timestamps: true,
  },
);

export default Reservation;
