module.exports = {
  port: 8090,
  title: 'Lou.lt',
  devel: false,
  logfile: 'logs/access.log',
  ip: '0.0.0.0',
  secret: 'secret',
  host: 'domain.tld',
  sessIdName: 'sessID',
  db: {
    host: 'localhost',
    name: 'lou_lt',
    sessionColl: 'session',
  }
};
