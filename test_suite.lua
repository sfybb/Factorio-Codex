#!/usr/bin/env lua

lu = require('tests.luaunit')

require("tests.quick_search_test")
require("tests.codex_categories_test")
require("tests.search_test")


local runner = lu.LuaUnit.new()
runner:setOutputType("text")
os.exit(runner:runSuite())
