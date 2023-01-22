local qs_math = require("scripts.quick_search.qs_math")


TestQsMath = {}
	function TestQsMath:test_addition()
		local math_result, math_err = qs_math.calculate_result("1234 +69 +	123.567+0.4+10+	") -- result = 1,436.967

		lu.assertEquals(math_result, 1436.967)
		lu.assertEquals(math_err, "")
	end

	function TestQsMath:test_subtraction()
		local math_result, math_err = qs_math.calculate_result("69420 -420 -	33.33-0.7-45-	") -- result = 68,920.97

		lu.assertEquals(math_result, 68920.97)
		lu.assertEquals(math_err, "")
	end

	function TestQsMath:test_multiplication()
		local math_result, math_err = qs_math.calculate_result("1*3*5*10*3.21 *	") -- result = 481.5

		lu.assertEquals(math_result, 481.5)
		lu.assertEquals(math_err, "")
	end

	function TestQsMath:test_division()
		local math_result, math_err = qs_math.calculate_result("481.5/3.21/5/	10  	/ ") -- result = 3

		lu.assertEquals(math_result, 3)
		lu.assertEquals(math_err, "")
	end

	function TestQsMath:test_exponents()
		local math_result, math_err = qs_math.calculate_result("2^3^2") -- result = 3

		lu.assertEquals(math_result, 512)
		lu.assertEquals(math_err, "")
	end

	function TestQsMath:test_brackets_simple()
		local math_result, math_err = qs_math.calculate_result("(1+4)/5") -- result = 1

		lu.assertEquals(math_result, 1)
		lu.assertEquals(math_err, "")
	end

	function TestQsMath:test_brackets()
		local math_result, math_err = qs_math.calculate_result("(4*(3+2))^2") -- result = 400

		lu.assertEquals(math_result, 400)
		lu.assertEquals(math_err, "")
	end
