import { DataTypes, Model } from "sequelize";
import sequelize from "../lib/config/database";

class Purchase extends Model {
  declare id: string;
  declare userId: string;
  declare dropId: string;
  declare reservationId: string;
}

Purchase.init(
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
    reservationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "purchases",
    timestamps: true,
  },
);

export default Purchase;
