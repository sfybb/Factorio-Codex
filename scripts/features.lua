local Features = {}
local Features_mt = { __index = Features }

function Features:Init()
    local o = {}
    setmetatable(o, Features_mt)

    o.defines = {
        localised_fallback = {id="localised-fallback", check="base >= 1.1.74"},
        dictionary_lite = {id="dictionary-lite", check="flib >= 0.12.0"},
        dictionary  = {id="dictionary", check="! flib >= 0.12.0"},
    }
    o.available = {}

    o:run_feature_checks()
    return o
end

function Features:load()
    if self ~= nil then
        setmetatable(self, Features_mt)
    end
end

function Features:run_feature_checks()
    for _, feat in pairs(self.defines) do
        if feat.check ~= nil then
            if self:run_check(feat.check) then
                --log("Feature requirements for \"".. _ .."\" fulfilled")
                self.available[feat.id] = true
            --[[else
                log("Feature requirements for \"".. _ .."\" not met")]]
            end
        else
            debug:log_warn("Empty check for feature \"".. _ .."\"! This feature can never be enabled")
        end
    end
    debug:log_info("Available features: " .. serpent.line(self.available, {comment=false}))
end

function Features:run_check(check_str)
    --log("Running check: "..check_str)
    local tokens = util:split(check_str, "%s")

    local state = "S"

    local modifier = nil
    local mod_name = nil
    local comparator = nil
    local reference_version = nil

    for _, token in ipairs(tokens) do
        if state == "S" then
            if string.match(token, "^%!$") then
                modifier = token
                state = "Sm"
            else
                state = "M"
            end
        end

        if state == "Sm" then
            state = "M"
        elseif state == "M" then
            if string.match(token, "^[%w%_%-]+$") then
                mod_name = token
                state = "Ec"
            else
                debug:log_err("Invalid mod id (index: ".. _ ..", \"".. token .."\") in check string: \"".. check_str .."\"")
                return false
            end
        elseif state == "Ec" then
            if string.match(token, "^[%<%=%>]=?$") then
                comparator = token
                state = "Ev"
            else
                debug:log_err("Invalid comparator (index: ".. _ ..", \"".. token .."\") in check string: \"".. check_str .."\"")
                return false
            end
        elseif state == "Ev" then
            if string.match(token, "^%d+%.%d+") then
                reference_version = token
                break
            else
                debug:log_err("Invalid comparator (index: ".. _ ..", \"".. token .."\") in check string: \"".. check_str .."\"")
                return false
            end
        end
    end

    if comparator ~= nil and reference_version == nil then
        debug:log_err("Comparator (".. comparator ..") requires a version to compare against! check string: \"".. check_str .."\"")
        return false
    end

    if comparator ~= nil and reference_version ~= nil then
        reference_version = util:normalize_version(reference_version)
    end

    --[[local debug_text = "Checking feature for: "

    if modifier ~= nil then
        debug_text = debug_text .. "[".. modifier .."] "
    end

    debug_text = debug_text .. "\"" .. mod_name .. "\""

    if comparator ~= nil then
        debug_text = debug_text .. " [" .. comparator .. "] \"" .. reference_version .. "\""
    end

    log(debug_text)]]

    local res
    if comparator == nil then
        local mode_ver = game.active_mods[mod_name]
        res = mode_ver ~= nil
    else
        local actual_version = game.active_mods[mod_name]
        if actual_version ~= nil then
            actual_version = util:normalize_version(actual_version)

            if comparator == "=" then
                res = actual_version == reference_version
            elseif comparator == ">" then
                res = actual_version > reference_version
            elseif comparator == ">=" then
                res = actual_version >= reference_version
            elseif comparator == "<" then
                res = actual_version < reference_version
            elseif comparator == "<=" then
                res = actual_version <= reference_version
            end
        end
    end

    if res == nil then
        return false
    end

    if modifier == "!" then
        return not res
    else
        return res
    end
end

return Features