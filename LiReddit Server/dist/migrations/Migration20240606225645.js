"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration20240606225645 = void 0;
const migrations_1 = require("@mikro-orm/migrations");
class Migration20240606225645 extends migrations_1.Migration {
    async up() {
        this.addSql('create table "post" ("id" serial primary key, "created_at" timestamptz(0) not null, "updated_at" timestamptz(0) not null, "title" text not null);');
    }
}
exports.Migration20240606225645 = Migration20240606225645;
//# sourceMappingURL=Migration20240606225645.js.map