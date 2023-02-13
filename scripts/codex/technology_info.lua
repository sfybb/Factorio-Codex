local TechInfo = { }
local TechInfo_mt = {__index = TechInfo}

function TechInfo:new (force_index)
    local o = {}   -- create object if user does not provide one
    setmetatable(o, TechInfo_mt)

    o.force_index = force_index
    return o
end

function TechInfo:load()
    setmetatable(self, TechInfo_mt)
end

function TechInfo:build_gui_for_tech(root_gui_elem, tech_id)

end