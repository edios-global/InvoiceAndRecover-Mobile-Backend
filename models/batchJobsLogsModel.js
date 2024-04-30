import mongoose from 'mongoose';

const batchJobsLogsSchema = mongoose.Schema(
    {
        batchJobStartDateTime: {
            type: Date,
            required: true,
        },
        batchJobEndDateTime: {
            type: Date,
            required: true,
        },
        batchJobName: {
            type: String,
            required: true,
        },
        numberOfProcessedRecords: {
            type: Number,
            required: true,
        },
        batchJobStatus: {
            type: String,
        },
        notes: {
            type: String,
        },
        createdDate: {
            type: Date,
            required: true,
        },
        lastModifiedDate: {
            type: Date,
        },
        lastModifiedBy: {
            type: Number,
        },
        recordType: {
            type: String,
            required: true,
            default: 'I',
        }
    }
)
const BatchJobsLogsModel = mongoose.model('batch_jobs_logs', batchJobsLogsSchema)
export default BatchJobsLogsModel;