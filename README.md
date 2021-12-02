# YT-Playlist-Instrumentation

## Protocol

1. electron app starts
2. start login process
3. request **current** video id
4. onload -> request **next** video id
5. onunload -> mark **current** video as done
6. repeat at **4.**
