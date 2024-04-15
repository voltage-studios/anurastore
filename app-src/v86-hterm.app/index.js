const t = new hterm.Terminal({ profileId: "default", storage: new lib.Storage.Memory() });

t.onTerminalReady = function () {
  // Create a new terminal IO object and give it the foreground.
  // (The default IO object just prints warning messages about unhandled
  // things to the the JS console.)
  const io = t.io.push();

  if (anura.x86 == undefined) {
    io.println("The x86 subsystem is not installed. Please enable it in Settings.");
  }

  anura.x86
    .openpty(
      "TERM=xterm DISPLAY=:0 bash",
      80,
      24,
      (data) => {
        // console.log(data);
        io.print(data);
      },
    )
    .then((pty) => {
      io.onVTKeystroke = (str) => {
        // Do something useful with str here.
        // For example, Secure Shell forwards the string onto the NaCl plugin.
        if (anura.x86 == undefined || !anura.x86.emulator.cpu_is_running) {
          io.println("Lost connection to the x86 subsystem");
          return;
        }
        anura.x86.writepty(pty, str);
      };

      io.sendString = (str) => {
        // Just like a keystroke, except str was generated by the terminal itself.
        // For example, when the user pastes a string.
        // Most likely you'll do the same thing as onVTKeystroke.

        if (anura.x86 == undefined || !anura.x86.emulator.cpu_is_running) {
          io.println("Lost connection to the x86 subsystem");
          return;
        }
        anura.x86.writepty(pty, str);
      };

      io.onTerminalResize = (columns, rows) => {
        // React to size changes here.
        // Secure Shell pokes at NaCl, which eventually results in
        // some ioctls on the host.

        if (anura.x86 == undefined || !anura.x86.emulator.cpu_is_running) {
          io.println("Lost connection to the x86 subsystem");
          return;
        }
        anura.x86.resizepty(pty, rows, columns);
      };

      // You can call io.push() to foreground a fresh io context, which can
      // be uses to give control of the terminal to something else.  When that
      // thing is complete, should call io.pop() to restore control to the
      // previous io object.
    });
};

t.decorate(document.querySelector("#terminal"));

t.installKeyboard();
