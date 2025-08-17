
from flask import Flask, request, jsonify
from encryption import encrypt_json, decrypt_json



app = Flask(__name__)


@app.route("/compute", methods=["POST"])
def compute():
    """
    Request JSON:
    {
      "payload": { "iv": "<b64>", "ct": "<b64>", "tag": "<b64>" }
    }

    Decrypted payload is expected to be: {"op":"add|mul|avg","a":number,"b":number}

    Response JSON:
    {
      "payload": { "iv": "<b64>", "ct": "<b64>", "tag": "<b64>" }   # encrypted {"result": <number>}
    }
    """
    body = request.get_json(force=True)
    if "payload" not in body:
        return jsonify({"error": "Missing 'payload'"}), 400

    try:
        # 1) Decrypt input
        data = decrypt_json(body["payload"])
        op = data.get("op")
        a = float(data.get("a", 0))
        b = float(data.get("b", 0))

        # 2) Compute
        if op == "add":
            result = a + b
        elif op == "mul":
            result = a * b
        elif op == "avg":
            result = (a + b) / 2
        else:
            return jsonify({"error": "unknown op"}), 400

        # 3) Encrypt result and return
        enc = encrypt_json({"result": result})
        return jsonify({"payload": enc})

    except Exception as e:
        return jsonify({"error": str(e)}), 500





if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5055, debug=True)
