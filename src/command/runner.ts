import { Command } from './command.js'
import { TurtleSmooth } from '../turtle.js'
import { Runner as AnimationRunner } from '../animation/runner.js'

type JobStepEnum = 'fetch' | 'setup' | 'tick' | 'end'

export class Runner {
    tt: TurtleSmooth
    jobs: Command[]
    currentJob: null | Command
    jobStep: JobStepEnum
    animationRunner: AnimationRunner
    constructor (tt: TurtleSmooth) {
        this.tt = tt
        this.jobs = []
        this.jobStep = 'fetch'
        this.currentJob = null
        this.animationRunner = new AnimationRunner(tt)
    }

    reset () {
        // 未実行の全JOBに対してresolve(1)を呼び出す。
        for (const job of this.jobs) {
            const resolve = job.resolve
            if (resolve !== null) {
                resolve(1)
            }
        }
        this.jobs = [] // ジョブをクリア
        this.currentJob = null
        this.jobStep = 'fetch'
    }

    add (command: Command):Promise<number> {
        const promise = command.getPromise()
        this.jobs.push(command)
        return promise
    }
    hasJob (): boolean {
        return this.jobs.length > 0 || this.currentJob !== null || this.jobStep !== 'fetch'
    }

    run (time:number, waitTime: number, immediateRun: boolean):number {
        while (time > 0 && this.hasJob()) {
            switch (this.jobStep) {
            case 'fetch':
                this.fetch()
                break
            case 'setup':
                this.setup(waitTime, immediateRun)
                break
            case 'tick':
                time = this.tick(time, immediateRun)
                break
            case 'end':
                time = this.end(time)
                break
            }
        }
        return time
    }

    private fetch ():void {
        // 処理中のJOBは無いので次のJOBを取得して処理に着手する
        this.currentJob = this.jobs.shift() || null
        this.jobStep = this.currentJob !== null ? 'setup' : 'fetch'
    }

    private setup (waitTime: number, immediateRun: boolean):void {
        if (!this.currentJob) {
            this.jobStep = 'fetch'
            return
        }
        if (!immediateRun && this.currentJob.useAnimation(this.tt)) {
            this.animationRunner.jobs.push(...this.currentJob.generateAnimationJob(this.tt))
        } else {
            this.currentJob.setup(this.tt, waitTime , immediateRun)
        }
        this.jobStep = 'tick'
    }

    private tick (time: number, immediateRun: boolean): number {
        if (!this.currentJob) {
            this.jobStep = 'fetch'
            return time
        }
        let remainTime:number
        if (this.animationRunner.hasJob()) {
            remainTime = this.animationRunner.run(time)
            if (!this.animationRunner.hasJob()) {
                this.jobStep = 'end'
            }
        } else {
            remainTime = this.currentJob.tick(this.tt, time, immediateRun)
            if (remainTime > 0) {
                this.jobStep = 'end'
            }
        }
        return remainTime
    }

    private end (time: number): number {
        if (!this.currentJob) {
            this.jobStep = 'fetch'
            return time
        }
        const remainTime = this.currentJob.end(this.tt, time)
        this.jobStep = 'fetch'
        this.currentJob = null
        return remainTime
    }
}
