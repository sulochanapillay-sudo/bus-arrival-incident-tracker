import type { Request, Response } from 'express';
import { fetchLtaData, resolveAccountKey } from './_ltaClient.js';

/**
 * MRT/LRT train service alerts endpoint
 * Upstream: https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts
 * Header: AccountKey
 */
export default async function handler(req: Request, res: Response) {
  const accountKey = resolveAccountKey(req);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');

  if (!accountKey) {
    // Return sample format matching LTA TrainServiceAlerts
    return res.status(200).json({
      odata_metadata: 'https://datamall2.mytransport.sg/ltaodataservice/$metadata#TrainServiceAlerts',
      value: {
        Status: 1, // 1 = Normal, 2 = Disrupted
        AffectedSegments: [],
        Message: [],
      },
      _warning: 'No LTA AccountKey provided. Set LTA_DATAMALL_ACCOUNT_KEY in .env or pass AccountKey header.',
      _liveMode: false,
    });
  }

  const result = await fetchLtaData('/TrainServiceAlerts', accountKey);

  if (!result.ok) {
    return res.status(result.status).json({
      error: result.error,
      statusCode: result.status,
      upstreamData: result.data,
      _hint: 'Ensure your LTA DataMall AccountKey is valid and active.',
    });
  }

  return res.status(200).json(result.data);
}
