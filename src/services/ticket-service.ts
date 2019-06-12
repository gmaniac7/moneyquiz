import {Injectable} from "@angular/core";
import {TICKETS} from "./tickets";

@Injectable()
export class TicketService {
  private tickets:any;

  constructor() {
    this.tickets = TICKETS;
  }

  getAll() {
    return this.tickets;
  }

  getItem(id) {
    for (var i = 0; i < this.tickets.length; i++) {
      if (this.tickets[i]._id === parseInt(id)) {
        return this.tickets[i];
      }
    }
    return null;
  }

  remove(item) {
    this.tickets.splice(this.tickets.indexOf(item), 1);
  }
}
