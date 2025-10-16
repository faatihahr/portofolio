const pool = require('./db/config');

// PROJECT CRUD
exports.createProject = async (data) => {
  const { title, description, image, category, link, status } = data;
  await pool.query(
    'INSERT INTO projects (title, description, image, category, link, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
    [title, description, image, category, link, status]
  );
};

exports.getAllProjects = async () => {
  const res = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
  return res.rows;
};

exports.getProjectById = async (id) => {
  // Asumsi kolom primary key di DB bernama 'id'
  const res = await pool.query('SELECT * FROM projects WHERE id_project = $1', [id]);
  return res.rows[0];
};

exports.updateProject = async (id, data) => {
  const { title, description, image, category, link, status } = data;
  await pool.query(
    'UPDATE projects SET title=$1, description=$2, image=$3, category=$4, link=$5, status=$6 WHERE id_project=$7',
    [title, description, image, category, link, status, id]
  );
};

exports.deleteProject = async (id) => {
  await pool.query('DELETE FROM projects WHERE id_project=$1', [id]);
};

// EXPERIENCE CRUD
exports.createExperience = async (data) => {
  const { job_name, position, company, logo, start_date, end_date, is_current, description, skills } = data;
  await pool.query(
    'INSERT INTO experiences (job_name, position, company, logo, start_date, end_date, is_current, description, skills, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())',
    [job_name, position, company, logo, start_date, end_date, is_current, description, skills]
  );
};

exports.getAllExperiences = async () => {
  const res = await pool.query('SELECT * FROM experiences ORDER BY created_at DESC');
  return res.rows;
};

exports.getExperienceById = async (id) => {
  // Asumsi kolom primary key di DB bernama 'id'
  const res = await pool.query('SELECT * FROM experiences WHERE id_exp = $1', [id]);
  return res.rows[0];
};

exports.updateExperience = async (id, data) => {
  const { job_name, position, company, logo, start_date, end_date, is_current, description, skills } = data;
  await pool.query(
    'UPDATE experiences SET job_name=$1, position=$2, company=$3, logo=$4, start_date=$5, end_date=$6, is_current=$7, description=$8, skills=$9 WHERE id_exp=$10',
    [job_name, position, company, logo, start_date, end_date, is_current, description, skills, id]
  );
};

exports.deleteExperience = async (id) => {
  await pool.query('DELETE FROM experiences WHERE id_exp=$1', [id]);
};