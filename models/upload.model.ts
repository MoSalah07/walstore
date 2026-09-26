import { model, models, Schema, Model, Types } from "mongoose";

// Product photos uploaded from the admin, served by /api/images/[id].
export interface IUpload {
  _id: Types.ObjectId;
  data: Buffer;
  contentType: string;
  size: number;
  name: string;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
}

const uploadSchema = new Schema<IUpload>(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    name: { type: String, default: "" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Upload = (models.Upload as Model<IUpload>) || model<IUpload>("Upload", uploadSchema);
export default Upload;
