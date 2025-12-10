import { NoDataInfo } from "../models/table";

export const SampleNoDataInfo: NoDataInfo = {
    title: 'No data found',
    description: 'Please try again later',
    image: new URL('assets/images/no-data.svg', import.meta.url)
};