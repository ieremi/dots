local mp = require "mp"

local function set_window_4()
    local p = mp.get_property_number("time-pos")

    if p then
        mp.set_property_number("ab-loop-a", p - 2)
        mp.set_property_number("ab-loop-b", p + 2)
    end
end

mp.add_key_binding(nil, "set-window-4", set_window_4)