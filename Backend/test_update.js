"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var path_1 = require("path");
var url_1 = require("url");
var dotenv_1 = require("dotenv");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = (0, path_1.dirname)(__filename);
(0, dotenv_1.config)({ path: (0, path_1.resolve)(__dirname, '.env') });
var CustomTextSchema = new mongoose_1.default.Schema({
    title: String,
    content: String,
    isActive: { type: Boolean, default: true },
    status: { type: String, default: 'active' },
    last_updated: Date
});
var BrainSchema = new mongoose_1.default.Schema({
    orgId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
    knowledge_base: {
        custom_text: [CustomTextSchema]
    }
}, { timestamps: true });
var Brain = mongoose_1.default.model('Brain', BrainSchema);
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var sourceId, brain, result, updatedBrain, entry;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, mongoose_1.default.connect(process.env.MONGODB_URI)];
                case 1:
                    _a.sent();
                    console.log("Connected to DB.");
                    sourceId = "69ad091a16b5eb3d9459e4c9";
                    return [4 /*yield*/, Brain.findOne({ "knowledge_base.custom_text._id": sourceId })];
                case 2:
                    brain = _a.sent();
                    if (!brain) {
                        console.log("Brain not found for sourceId.");
                        process.exit(0);
                    }
                    console.log("Executing raw MongoDB positional update ($)...");
                    return [4 /*yield*/, Brain.updateOne({ _id: brain._id, "knowledge_base.custom_text._id": sourceId }, { $set: { "knowledge_base.custom_text.$.title": "Dual-Database Strategy..." } })];
                case 3:
                    result = _a.sent();
                    console.log("Update matched:", result.matchedCount, "Modified:", result.modifiedCount);
                    return [4 /*yield*/, Brain.findOne({ _id: brain._id })];
                case 4:
                    updatedBrain = _a.sent();
                    entry = updatedBrain.knowledge_base.custom_text.find(function (e) { return e._id.toString() === sourceId; });
                    console.log("NEW TITLE IN DB:", entry === null || entry === void 0 ? void 0 : entry.title);
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
run().catch(function (err) {
    console.error(err);
    process.exit(1);
});
