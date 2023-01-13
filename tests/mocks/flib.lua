local flib_mock = {
    table = require("tests.mocks.flib.table"),
    gui = require("tests.mocks.flib.gui"),
}

package.preload['__flib__.table'] = function() return flib_mock.table end
package.preload['__flib__.gui'] = function() return flib_mock.gui end
--package.preload['__flib__.table'] = function() return f_table end


