/*!
 * Copyright (c) 2020 Digital Bazaar, Inc. All rights reserved.
 */
export function isFunction(value, name) {
  if(typeof value !== 'function') {
    throw new TypeError(`"${name}" must be a function.`);
  }
}
