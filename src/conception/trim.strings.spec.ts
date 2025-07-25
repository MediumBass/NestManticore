import { TrimPipe } from './trim.strings.pipe';
import { BadRequestException } from '@nestjs/common';

describe('TrimPipe', () => {
  let pipe: TrimPipe;

  beforeEach(() => {
    pipe = new TrimPipe();
  });

  it('should trim string properties recursively except "password"', () => {
    const input = {
      name: '  John Doe  ',
      email: '  john@example.com ',
      password: '  secret  ',
      nested: {
        city: '  Kyiv  ',
        password: '  nestedSecret  ',
        info: {
          country: '  Ukraine  ',
          age: 30,
          note: '  note with spaces  ',
        },
      },
    };

    const expected = {
      name: 'John Doe',
      email: 'john@example.com',
      password: '  secret  ',
      nested: {
        city: 'Kyiv',
        password: '  nestedSecret  ',
        info: {
          country: 'Ukraine',
          age: 30,
          note: 'note with spaces',
        },
      },
    };

    const result = pipe.transform(input, {
      type: 'body',
      metatype: undefined,
      data: undefined,
    });
    expect(result).toEqual(expected);
  });

  it('should throw BadRequestException if input is not an object or type is not "body"', () => {
    expect(() =>
      pipe.transform('string', {
        type: 'body',
        metatype: undefined,
        data: undefined,
      }),
    ).toThrow(BadRequestException);

    expect(() =>
      pipe.transform(
        { name: 'test' },
        { type: 'query', metatype: undefined, data: undefined },
      ),
    ).toThrow(BadRequestException);
  });

  it('should return the same object if it is empty', () => {
    const input = {};
    const result = pipe.transform(input, {
      type: 'body',
      metatype: undefined,
      data: undefined,
    });
    expect(result).toEqual({});
  });
});
