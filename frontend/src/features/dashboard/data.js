import { mockScan } from "@/lib/mockData";
import { getDashboardData } from "@/lib/api";

export const getDashboardFeatureData = async () => {
  return await getDashboardData();
};

export { mockScan };
