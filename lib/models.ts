import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER';

export interface IUser extends Document {
  username: string;
  email?: string;
  passwordHash: string;
  name: string;
  phone?: string;
  roomNumber?: string;
  role: UserRole;
  isActive: boolean;
  messId: string;
  memberId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    roomNumber: { type: String, default: '' },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'MEMBER'],
      default: 'MEMBER',
    },
    isActive: { type: Boolean, default: true },
    messId: { type: String, default: '9D', uppercase: true },
    memberId: { type: Number },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

// Mess Data Record Schema for sync with accounting engine
export interface IMessRecord extends Document {
  recordId: string;
  messId: string;
  recordType: 'MEMBER' | 'MEAL' | 'EXPENSE' | 'DEPOSIT' | 'ROSTER' | 'NOTICE';
  monthKey: string;
  title: string;
  subtitle: string;
  role: string;
  linkedUid: string;
  entityLocalId: number;
  targetMemberId: number;
  amount: number;
  breakfast: number;
  lunch: number;
  dinner: number;
  guestMeal: number;
  active: boolean;
  createdBy: string;
  payload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const MessRecordSchema = new Schema<IMessRecord>(
  {
    recordId: { type: String, required: true, unique: true, index: true },
    messId: { type: String, required: true, index: true },
    recordType: { type: String, required: true, index: true },
    monthKey: { type: String, default: 'ALL', index: true },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    role: { type: String, default: '' },
    linkedUid: { type: String, default: '' },
    entityLocalId: { type: Number, default: 0 },
    targetMemberId: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    breakfast: { type: Number, default: 0 },
    lunch: { type: Number, default: 0 },
    dinner: { type: Number, default: 0 },
    guestMeal: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    createdBy: { type: String, default: '' },
    payload: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const MessRecordModel =
  mongoose.models.MessRecord || mongoose.model<IMessRecord>('MessRecord', MessRecordSchema);

// Mess Settings Schema
export interface IMessSetting extends Document {
  messId: string;
  messName: string;
  managerPin: string;
  lockedDates: string[];
  updatedAt: Date;
}

const MessSettingSchema = new Schema<IMessSetting>(
  {
    messId: { type: String, required: true, unique: true, uppercase: true },
    messName: { type: String, default: 'My Mess' },
    managerPin: { type: String, default: '16247' },
    lockedDates: [{ type: String }],
  },
  { timestamps: true }
);

export const MessSettingModel =
  mongoose.models.MessSetting || mongoose.model<IMessSetting>('MessSetting', MessSettingSchema);

