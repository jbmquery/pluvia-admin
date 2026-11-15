# app.py
from flask import Flask, jsonify
from flask_cors import CORS

import config
from src.hooks.request_hooks import register_hooks
from src.routes.login_routes import login_bp

app = Flask(__name__)
app.config["SECRET_KEY"] = config.SECRET_KEY

# supports_credentials=True permite enviar/recibir la cookie de sesión
CORS(app, origins=config.FRONTEND_ORIGINS, supports_credentials=True)

register_hooks(app)
app.register_blueprint(login_bp)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "success",
        "message": "¡API de Pluvia Admin funcionando correctamente con Flask y PostgreSQL!"
    })


if __name__ == "__main__":
    app.run(debug=True, port=5010)
