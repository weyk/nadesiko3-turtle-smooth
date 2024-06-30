import { TurtleSmooth } from '../turtle.js'

import { Animation } from './animation.js'

type JobStepEnum = 'fetch'|'setup'|'tick'|'end'

export class Runner {
    tt: TurtleSmooth
    jobs: Animation[]
    currentJob: null | Animation
    jobStep: JobStepEnum
    constructor (tt: TurtleSmooth) {
        this.tt = tt
        this.jobs = []
        this.currentJob = null
        this.jobStep = 'fetch'
    }

    reset ():void {
        this.jobs = []
        this.currentJob = null
        this.jobStep = 'fetch'
    }

    hasJob (): boolean {
        return this.jobs.length > 0 || this.currentJob !== null || this.jobStep !== 'fetch'
    }

    run (time:number):number {
        while (time > 0 && this.hasJob()) {
            switch (this.jobStep) {
            case 'fetch':
                this.fetch()
                break
            case 'setup':
                this.setup()
                break
            case 'tick':
                time = this.tick(time)
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

    private setup ():void {
        if (!this.currentJob) {
            this.jobStep = 'fetch'
            return
        }
        this.currentJob.setup(this.tt)
        this.jobStep = 'tick'
    }

    private tick (time: number): number {
        if (!this.currentJob) {
            this.jobStep = 'fetch'
            return time
        }
        const remainTime = this.currentJob.tick(this.tt, time)
        if (remainTime > 0) {
            this.jobStep = 'end'
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
