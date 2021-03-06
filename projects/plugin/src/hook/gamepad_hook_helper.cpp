#include "gamepad_hook_helper.hpp"
#include <libgamepad.hpp>
#include "../util/obs_util.hpp"
#include "../util/log.h"
#include "../util/config.hpp"

namespace libgamepad {

std::shared_ptr<gamepad::hook> hook_instance = nullptr;
bool state;
uint16_t last_input;
uint64_t last_input_time;
std::mutex last_input_mutex;

void start_pad_hook()
{
    if (state)
        return;
    uint16_t flags = io_config::use_js ? gamepad::hook_type::JS : gamepad::hook_type::BY_ID;
    flags |= io_config::use_dinput ? gamepad::hook_type::DIRECT_INPUT : gamepad::hook_type::NATIVE_DEFAULT;
    hook_instance = gamepad::hook::make(flags);
    hook_instance->set_plug_and_play(true);
    hook_instance->set_sleep_time(1); // 1ms should be fast enough to prevent events from queueing up

    /* Pipe gamepad log to obs log */
    auto log_pipe = [](int level, const char *msg, va_list args, void *) {
        switch (level) {
        case gamepad::LOG_DEBUG:
            blogva(LOG_DEBUG, msg, args);
            break;
        case gamepad::LOG_ERROR:
            blogva(LOG_ERROR, msg, args);
            break;
        case gamepad::LOG_INFO:
            blogva(LOG_INFO, msg, args);
            break;
        case gamepad::LOG_WARNING:
            blogva(LOG_WARNING, msg, args);
            break;
        default:;
        }
    };
    gamepad::set_logger(log_pipe, nullptr);

    hook_instance->set_axis_event_handler([](std::shared_ptr<gamepad::device> d) {
        std::lock_guard<std::mutex> lock(last_input_mutex);
        last_input = d->last_axis_event()->native_id;
        last_input_time = d->last_axis_event()->time;
    });
    hook_instance->set_button_event_handler([](std::shared_ptr<gamepad::device> d) {
        std::lock_guard<std::mutex> lock(last_input_mutex);
        last_input = d->last_button_event()->native_id;
        last_input_time = d->last_button_event()->time;
    });

    hook_instance->set_connect_event_handler(
        [](std::shared_ptr<gamepad::device> d) { binfo("'%s' connected", d->get_name().c_str()); });
    hook_instance->set_disconnect_event_handler(
        [](std::shared_ptr<gamepad::device> d) { binfo("'%s' disconnected", d->get_name().c_str()); });
    hook_instance->set_reconnect_event_handler(
        [](std::shared_ptr<gamepad::device> d) { binfo("'%s' reconnected", d->get_name().c_str()); });

    hook_instance->load_bindings(std::string(qt_to_utf8(util_get_data_file("gamepad_bindings.json"))));

    if (hook_instance->start()) {
        binfo("gamepad hook started");
        state = true;
    } else {
        bwarn("gamepad hook couldn't be started");
    }
}

void end_pad_hook()
{
    hook_instance->stop();
    hook_instance->save_bindings(std::string(qt_to_utf8(util_get_data_file("gamepad_bindings.json"))));
    state = false;
}

}
