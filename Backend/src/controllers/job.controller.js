import Job from '../models/Job.js';

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Private
export const getJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (error) {
        next(error);
    }
};

// @desc    Add new job
// @route   POST /api/jobs
// @access  Private
export const addJob = async (req, res, next) => {
    try {
        req.body.user = req.user.id;
        const job = await Job.create(req.body);
        res.status(201).json(job);
    } catch (error) {
        next(error);
    }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private
export const updateJob = async (req, res, next) => {
    try {
        let job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Make sure user owns job
        if (job.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        res.json(job);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private
export const deleteJob = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Make sure user owns job
        if (job.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await job.deleteOne();

        res.json({ message: 'Job removed' });
    } catch (error) {
        next(error);
    }
};
