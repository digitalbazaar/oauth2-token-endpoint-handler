/*!
 * Copyright (c) 2020-2023 Digital Bazaar, Inc. All rights reserved.
 */
export default new Proxy({}, {
  get() {
    return () => {};
  }
});
