local mp = require "mp"
local function check_b()
    local b = mp.get_property_number("ab-loop-b")
    if b then
        local a = b - 2
        mp.set_property_number("ab-loop-a", a)
        mp.set_property_number("time-pos", a)
    end
end

mp.add_key_binding(nil, "check-b", check_b)