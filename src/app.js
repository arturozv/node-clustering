const express = require("express");
const cluster = require("cluster");
const Queue = require('bull');
const cpus = require("os").cpus().length;

async function run() {
    const queue = new Queue('queue', `redis://127.0.0.1:6379`);

    if (cluster.isPrimary) {
        const app = express();
        app.listen(3000);

        console.log(`Number of CPUs is ${cpus}`);
        console.log(`Primary process is running: ${process.pid}`);

        // Fork workers.
        for (let i = 0; i < cpus; i++) {
            cluster.fork();
        }

        app.get('/', function (req, res) {
            const job = { date: Date.now() };
            queue.add(job)
            console.log('job queued', job)
            res.send(`job queued: ${JSON.stringify(job, null, 2)}`)
        })

        cluster.on('exit', function (worker, code, signal) {
            console.log('worker ' + worker.process.pid + ' died');
        });

        queue.on('completed', function (job, result) {
            console.log(`job completed`, job, result)
        })

    } else {
        console.log(`Worker process is running: ${process.pid}`);
        // Notify primary about the request
        queue.process(async (job, jobDone) => {
            console.log('Job done by worker', cluster.worker.id, job.id);
            jobDone();
        });
    }
}

run().catch(e => console.log(e));
