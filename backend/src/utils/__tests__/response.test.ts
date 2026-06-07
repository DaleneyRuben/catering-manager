import type { Response } from 'express';
import { sendSuccess, sendPaginated, sendError } from '../response';

const mockRes = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { res: { status } as unknown as Response, status, json };
};

describe('sendSuccess', () => {
  it('responds 200 with data wrapped in data key', () => {
    const { res, status, json } = mockRes();
    sendSuccess(res, { id: 1 });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ data: { id: 1 } });
  });

  it('uses a custom status code', () => {
    const { res, status, json } = mockRes();
    sendSuccess(res, { id: 1 }, 201);
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ data: { id: 1 } });
  });

  it('wraps array data', () => {
    const { res, status, json } = mockRes();
    sendSuccess(res, [1, 2, 3]);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ data: [1, 2, 3] });
  });
});

describe('sendPaginated', () => {
  it('responds 200 with data, total, page, and limit', () => {
    const { res, status, json } = mockRes();
    sendPaginated(res, [{ id: 1 }], 50, 2, 10);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ data: [{ id: 1 }], total: 50, page: 2, limit: 10 });
  });

  it('works with empty data array', () => {
    const { res, status, json } = mockRes();
    sendPaginated(res, [], 0, 1, 10);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ data: [], total: 0, page: 1, limit: 10 });
  });
});

describe('sendError', () => {
  it('responds 500 with message by default', () => {
    const { res, status, json } = mockRes();
    sendError(res, 'Something went wrong');
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ message: 'Something went wrong' });
  });

  it('uses a custom status code', () => {
    const { res, status, json } = mockRes();
    sendError(res, 'Not found', 404);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ message: 'Not found' });
  });
});
