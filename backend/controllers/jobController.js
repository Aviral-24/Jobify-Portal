import { StatusCodes } from 'http-status-codes';
import day from 'dayjs';
import { query, execute } from '../db.js';

export const getAllJobs = async (req, res) => {
  const { search, jobStatus, jobType, sort } = req.query;

  let whereClause = 'WHERE createdBy = ?';
  const params = [req.user.userId];

  if (search) {
    whereClause += ' AND (position LIKE ? OR company LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (jobStatus && jobStatus !== 'all') {
    whereClause += ' AND jobStatus = ?';
    params.push(jobStatus);
  }
  if (jobType && jobType !== 'all') {
    whereClause += ' AND jobType = ?';
    params.push(jobType);
  }

  const sortOptions = {
    newest: 'createdAt DESC',
    oldest: 'createdAt ASC',
    'a-z': 'position ASC',
    'z-a': 'position DESC',
  };

  const sortKey = sortOptions[sort] || sortOptions.newest;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const jobs = await query(
    `SELECT * FROM jobs ${whereClause} ORDER BY ${sortKey} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const countResult = await query(
    `SELECT COUNT(*) AS totalJobs FROM jobs ${whereClause}`,
    params
  );
  const totalJobs = countResult[0]?.totalJobs || 0;
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

  const result = await execute(
    'INSERT INTO jobs (company, position, jobStatus, jobType, jobLocation, createdBy) VALUES (?, ?, ?, ?, ?, ?)',
    [company, position, jobStatus, jobType, jobLocation, req.user.userId]
  );

  const [job] = await query('SELECT * FROM jobs WHERE id = ?', [result.insertId]);
  res.status(StatusCodes.CREATED).json({ job });
};

export const getJob = async (req, res) => {
  const [job] = await query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
  res.status(StatusCodes.OK).json({ job });
};

export const updateJob = async (req, res) => {
  const fields = [];
  const params = [];
  Object.entries(req.body).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    params.push(value);
  });
  params.push(req.params.id);

  await execute(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`, params);
  const [job] = await query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);

  res.status(StatusCodes.OK).json({ msg: 'job modified', job });
};

export const deleteJob = async (req, res) => {
  const [job] = await query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
  await execute('DELETE FROM jobs WHERE id = ?', [req.params.id]);
  res.status(StatusCodes.OK).json({ msg: 'job deleted', job });
};

export const showStats = async (req, res) => {
  const statsResult = await query(
    'SELECT jobStatus, COUNT(*) AS count FROM jobs WHERE createdBy = ? GROUP BY jobStatus',
    [req.user.userId]
  );

  const stats = statsResult.reduce((acc, curr) => {
    acc[curr.jobStatus] = curr.count;
    return acc;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };

  const monthlyApplicationsResult = await query(
    `SELECT YEAR(createdAt) AS year, MONTH(createdAt) AS month, COUNT(*) AS count
     FROM jobs
     WHERE createdBy = ?
     GROUP BY YEAR(createdAt), MONTH(createdAt)
     ORDER BY year DESC, month DESC
     LIMIT 6`,
    [req.user.userId]
  );

  const monthlyApplications = monthlyApplicationsResult
    .map((item) => {
      const date = day()
        .month(item.month - 1)
        .year(item.year)
        .format('MMM YY');
      return { date, count: item.count };
    })
    .reverse();

  res.status(StatusCodes.OK).json({ defaultStats, monthlyApplications });
};
