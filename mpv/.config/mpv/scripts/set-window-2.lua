local mp = require "mp"

local function set_window_2()
    local a = mp.get_property_number("ab-loop-a")

    if a then
        mp.set_property_number("ab-loop-b", a + 2)
    end
end

mp.add_key_binding(nil, "set-window-2", set_window_2)