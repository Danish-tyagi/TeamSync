import mongoose, { Document, Schema, Types } from 'mongoose'

export type TaskStatus = 'pending' | 'in-progress' | 'completed'

export interface ITask extends Document {
  title: string
  description: string
  status: TaskStatus
  assignedTo: Types.ObjectId | null
  projectId: Types.ObjectId
  deadline: Date | null
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
  isOverdue: boolean
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    deadline: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// virtual field to check if task is past deadline
taskSchema.virtual('isOverdue').get(function (this: ITask) {
  if (!this.deadline || this.status === 'completed') return false
  return new Date() > this.deadline
})

taskSchema.index({ projectId: 1 })
taskSchema.index({ assignedTo: 1 })

export default mongoose.model<ITask>('Task', taskSchema)
