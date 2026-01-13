import asyncio
import uvicorn
from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource
from starlette.applications import Starlette
from starlette.routing import Route, Mount
from starlette.responses import JSONResponse

# 1. Define the Server
server = Server("my-demo-server")

# 2. Define Tools
@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "calculate_sum":
        a = arguments.get("a")
        b = arguments.get("b")
        return [TextContent(type="text", text=f"The sum is {a + b}")]
    raise ValueError(f"Unknown tool: {name}")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="calculate_sum",
            description="Adds two numbers",
            inputSchema={
                "type": "object",
                "properties": {
                    "a": {"type": "integer"},
                    "b": {"type": "integer"}
                },
                "required": ["a", "b"]
            }
        )
    ]

# 3. specific SSE Transport setup using Starlette (framework agnostic)
sse = SseServerTransport("/messages")

async def handle_sse(request):
    async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
        await server.run(streams[0], streams[1], server.create_initialization_options())

async def handle_messages(request):
    await sse.handle_post_message(request.scope, request.receive, request._send)

# 4. Create the Web App
app = Starlette(
    routes=[
        Route("/sse", endpoint=handle_sse),
        Route("/messages", endpoint=handle_messages, methods=["POST"]),
    ]
)

if __name__ == "__main__":
    # Run looking like: http://localhost:8000/sse
    uvicorn.run(app, host="0.0.0.0", port=8000)
