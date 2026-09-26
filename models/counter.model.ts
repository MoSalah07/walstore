import { model, models, Schema, Model } from "mongoose";

// Atomic sequences, e.g. human-readable order numbers.
interface ICounter {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter = (models.Counter as Model<ICounter>) || model<ICounter>("Counter", counterSchema);

export async function nextSequence(name: string, start = 10000) {
  const doc = await Counter.findOneAndUpdate(
    { _id: name },
    [{ $set: { seq: { $add: [{ $ifNull: ["$seq", start] }, 1] } } }],
    { new: true, upsert: true }
  );
  return doc!.seq;
}

export default Counter;
