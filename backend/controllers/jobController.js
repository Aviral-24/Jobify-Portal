import { StatusCodes } from 'http-status-codes';
import day from 'dayjs';
import Job from '../models/Job.js';

export const getAllJobs = async (req, res) => {
  const { search, jobStatus, jobType, sort } = req.query;

  const queryObj = { createdBy: req.user.userId };

  if (search) {
    queryObj.$or = [
      { position: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  if (jobStatus && jobStatus !== 'all') {
    queryObj.jobStatus = jobStatus;
  }

  if (jobType && jobType !== 'all') {
    queryObj.jobType = jobType;
  }

  const sortOptions = {
    newest: '-createdAt',
    oldest: 'createdAt',
    'a-z': 'position',
    'z-a': '-position',
  };

  const sortKey = sortOptions[sort] || sortOptions.newest;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const jobs = await Job.find(queryObj).sort(sortKey).skip(skip).limit(limit);
  const totalJobs = await Job.countDocuments(queryObj);
  const numOfPages = Math.ceil(totalJobs / limit);

  res
    .status(StatusCodes.OK)
    .json({ totalJobs, numOfPages, currentPage: page, jobs });
};

export const createJob = async (req, res) => {
  const {
    company,
    position,
    jobStatus = 'pending',
    jobType = 'full-time',
    jobLocation = 'my city',
  } = req.body;

  const job = new Job({
    company,
    position,
    jobStatus,
    jobType,
    jobLocation,
    createdBy: req.user.userId,
  });

  const newJob = await job.save();
  res.status(StatusCodes.CREATED).json({ job: newJob });
};

export const getJob = async (req, res) => {
  const job = await Job.findById(req.params.id);
  res.status(StatusCodes.OK).json({ job });
};

export const updateJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({ msg: 'job modified', job });
};

export const deleteJob = async (req, res) => {
  const job = await Job.findByIdAndDelete(req.params.id);
  res.status(StatusCodes.OK).json({ msg: 'job deleted', job });
};

export const showStats = async (req, res) => {
  const statsResult = await Job.aggregate([
    { $match: { createdBy: req.user.userId } },
    { $group: { _id: '$jobStatus', count: { $sum: 1 } } },
  ]);

  const stats = statsResult.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  const monthlyApplications = await Job.aggregate([
    { $match: { createdBy: req.user.userId } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { '_id.year': -1, '_id.month': -1 },
    },
    {
      $limit: 6,
    },
  ]);

  const formattedMonthlyApplications = monthlyApplications
    .map((item) => {
      const date = day()
        .month(item._id.month - 1)
        .year(item._id.year)
        .format('MMM YY');
      return { date, count: item.count };
    })
    .reverse();

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications: formattedMonthlyApplications });
};
