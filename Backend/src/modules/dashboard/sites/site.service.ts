//src/services/site.service.ts
import Site from "@modules/dashboard/sites/Site.js";
import crypto from "crypto";

export const createSite = async (tenantId: string, domain: string[]) => {
  const siteKey = crypto.randomBytes(8).toString("hex");
  const siteSecret = crypto.randomBytes(16).toString("hex");

  const site = await Site.create({
    tenantId,
    domain,
    siteKey,
    siteSecret,
  });
  return site;
};

export const listSites = async (tenantId: string) => {
  return await Site.find({ tenantId });
};

export const updateSite = async (tenantId: string, id: string, data: any) => {
  return await Site.findOneAndUpdate({ _id: id, tenantId }, data, { new: true });
};

export const deleteSite = async (tenantId: string, id: string) => {
  return await Site.findOneAndDelete({ _id: id, tenantId });
};
