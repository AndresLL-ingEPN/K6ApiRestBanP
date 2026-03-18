import { check, sleep } from 'k6';
import http from 'k6/http';
import { randomIntBetween } from '../../libs/k6-utils/1.4.0/index.js';
import { readCsvFile } from '../../utils/getDataFromCsvFile.js';
import { generalSummary } from '../../utils/generate-reports/summaryConfig.js';

export const options = {
  scenarios: {
    load_test: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1s',
      preAllocatedVUs: 50,
      maxVUs: 100,
      stages: [
        { target: 20, duration: '30s' },
        { target: 20, duration: '1m' },
        { target: 0,  duration: '20s' },
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed:   ['rate<0.03'],
  },
};
const csvRead = readCsvFile('user', './data/test-data.csv');

export default function () {
  const index = Math.floor(Math.random() * csvRead.length);
  const data = csvRead[index];
  const response_login = doLogin(data);

  check(response_login, {
    'login status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'login response has token':   (r) => r.body.includes('token'),
  });

  if (response_login.status !== 200 && response_login.status !== 201) {
    console.error(`[UNEXPECTED] status=${response_login.status} body=${response_login.body}`);
  }

  sleep(randomIntBetween(1, 3));
}

function doLogin(data) {
  const base_url = 'https://fakestoreapi.com';
  const url_login = `${base_url}/auth/login`;

  let params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const payload_login = `
  {
    "username": "${data.username}",
    "password": "${data.password}"
  }
  `;

  return http.post(url_login, payload_login, params);
}

export function handleSummary(data) {
  return {
    ...generalSummary(data),
    'resultado_k6.json': JSON.stringify(data, null, 2),
  };
}
