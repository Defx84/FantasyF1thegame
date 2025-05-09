const mongoose = require('mongoose');

const systemAdminSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    permissions: {
        systemMonitoring: {
            type: Boolean,
            default: true
        },
        userManagement: {
            type: Boolean,
            default: true
        },
        leagueManagement: {
            type: Boolean,
            default: true
        },
        systemSettings: {
            type: Boolean,
            default: true
        }
    },
    lastAccess: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
systemAdminSchema.index({ user: 1 });

const SystemAdmin = mongoose.model('SystemAdmin', systemAdminSchema);

module.exports = SystemAdmin; 