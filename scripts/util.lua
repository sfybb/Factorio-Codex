function round(num, decimals)
    local num_shift = 10^decimals
    local shifted_num = num * num_shift
    local shifted_num_decimal = shifted_num - math.floor(shifted_num)

    if (shifted_num > 0) == (shifted_num_decimal >= 0.5) then
        return math.ceil(shifted_num) / num_shift
    else
        return math.floor(shifted_num) / num_shift
    end
end

function string:endswith(ending)
    return ending == "" or self:sub(-#ending) == ending
end

math.round = round
