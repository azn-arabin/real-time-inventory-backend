import { DataTypes, Model } from "sequelize";
import sequelize from "../lib/config/database";

class Drop extends Model {
  declare id: string;
  declare name: string;
  declare price: number;
  declare totalStock: number;
  declare availableStock: number;
  declare imageUrl: string | null;
  declare dropStartsAt: Date;
}

Drop.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    availableStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    dropStartsAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "drops",
    timestamps: true,
  },
);

export default Drop;
