import {BaseService} from "@/shared/services/base-service.js";

export class ScheduleService extends BaseService{
    constructor() {
        super("/schedules");
    }

}