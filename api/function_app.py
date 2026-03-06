import azure.functions as func
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from scipy.stats import norm
import io
import base64

app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)


def _parse_body(req: func.HttpRequest) -> dict:
    try:
        return req.get_json()
    except ValueError:
        return {}


def _plot_normal(mean: float, std: float, x_min: float, x_max: float, show_fill: bool) -> str:
    x = np.linspace(x_min, x_max, 500)
    y = norm.pdf(x, loc=mean, scale=std)

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(x, y, color="#3b82f6", linewidth=2.5, label=f"N(μ={mean}, σ={std})")

    if show_fill:
        ax.fill_between(x, y, alpha=0.15, color="#3b82f6")
        regions = [
            (mean - std,     mean + std,     0.25, "±1σ (68.3%)"),
            (mean - 2 * std, mean + 2 * std, 0.15, "±2σ (95.4%)"),
            (mean - 3 * std, mean + 3 * std, 0.08, "±3σ (99.7%)"),
        ]
        colors = ["#3b82f6", "#6366f1", "#8b5cf6"]
        for (lo, hi, alpha, label), color in zip(regions, colors):
            mask = (x >= lo) & (x <= hi)
            ax.fill_between(x[mask], y[mask], alpha=alpha, color=color, label=label)

    ax.axvline(mean, color="#ef4444", linewidth=1.2, linestyle="--", label=f"μ = {mean}")
    ax.axvline(mean - std, color="#f59e0b", linewidth=0.8, linestyle=":",
               label=f"μ±σ = [{mean - std:.2f}, {mean + std:.2f}]")
    ax.axvline(mean + std, color="#f59e0b", linewidth=0.8, linestyle=":")

    ax.set_xlabel("x", fontsize=12)
    ax.set_ylabel("Densité de probabilité", fontsize=12)
    ax.set_title(f"Loi normale — μ = {mean}, σ = {std}", fontsize=14, fontweight="bold")
    ax.legend(fontsize=9, loc="upper right")
    ax.grid(True, alpha=0.3)
    ax.set_xlim(x_min, x_max)
    ax.set_ylim(bottom=0)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")


@app.route(route="plot", methods=["POST"])
def plot(req: func.HttpRequest) -> func.HttpResponse:
    data = _parse_body(req)
    try:
        mean = float(data.get("mean", 0))
        std = float(data.get("std", 1))
        x_min = float(data.get("x_min", mean - 4 * std))
        x_max = float(data.get("x_max", mean + 4 * std))
        show_fill = bool(data.get("show_fill", True))
    except (TypeError, ValueError) as e:
        return func.HttpResponse(
            json.dumps({"error": f"Paramètre invalide : {e}"}),
            status_code=400,
            mimetype="application/json",
        )

    if std <= 0:
        return func.HttpResponse(
            json.dumps({"error": "σ doit être strictement positif"}),
            status_code=400,
            mimetype="application/json",
        )
    if x_min >= x_max:
        return func.HttpResponse(
            json.dumps({"error": "x_min doit être inférieur à x_max"}),
            status_code=400,
            mimetype="application/json",
        )

    img_b64 = _plot_normal(mean, std, x_min, x_max, show_fill)
    return func.HttpResponse(
        json.dumps({"image": img_b64}),
        status_code=200,
        mimetype="application/json",
    )


@app.route(route="poisson", methods=["POST"])
def poisson_plot(req: func.HttpRequest) -> func.HttpResponse:
    data = _parse_body(req)
    try:
        lam = float(data.get("lam", 3))
        k_max = int(data.get("k_max", 15))
    except (TypeError, ValueError) as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=400, mimetype="application/json")

    if lam <= 0:
        return func.HttpResponse(json.dumps({"error": "λ doit être strictement positif"}), status_code=400, mimetype="application/json")

    from scipy.stats import poisson as sp_poisson
    k = np.arange(0, k_max + 1)
    pmf = sp_poisson.pmf(k, lam)
    mode = int(lam)

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(k, pmf, color="#10b981", alpha=0.6, width=0.7, label=f"P(λ={lam})")
    ax.plot(k, pmf, "o-", color="#059669", markersize=5, linewidth=1.5)
    if mode <= k_max:
        ax.bar([mode], [pmf[mode]], color="#10b981", alpha=1.0, width=0.7, label=f"Mode = {mode}")
    ax.set_xlabel("k", fontsize=12)
    ax.set_ylabel("P(X = k)", fontsize=12)
    ax.set_title(f"Loi de Poisson — λ = {lam}", fontsize=14, fontweight="bold")
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3, axis="y")
    ax.set_xlim(-0.5, k_max + 0.5)
    ax.set_ylim(bottom=0)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return func.HttpResponse(json.dumps({"image": base64.b64encode(buf.read()).decode("utf-8")}), status_code=200, mimetype="application/json")


@app.route(route="student", methods=["POST"])
def student_plot(req: func.HttpRequest) -> func.HttpResponse:
    data = _parse_body(req)
    try:
        df = max(1, int(data.get("df", 5)))
        compare_normal = bool(data.get("compare_normal", True))
    except (TypeError, ValueError) as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=400, mimetype="application/json")

    from scipy.stats import t as sp_t
    x = np.linspace(-5, 5, 500)
    y_t = sp_t.pdf(x, df=df)

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(x, y_t, color="#f59e0b", linewidth=2.5, label=f"t(ν={df})")
    ax.fill_between(x, y_t, alpha=0.15, color="#f59e0b")
    if compare_normal:
        y_n = norm.pdf(x)
        ax.plot(x, y_n, color="#94a3b8", linewidth=1.5, linestyle="--", alpha=0.8, label="N(0, 1)")
    ax.set_xlabel("x", fontsize=12)
    ax.set_ylabel("Densité de probabilité", fontsize=12)
    ax.set_title(f"Loi de Student — ν = {df} degrés de liberté", fontsize=14, fontweight="bold")
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(-5, 5)
    ax.set_ylim(bottom=0)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return func.HttpResponse(json.dumps({"image": base64.b64encode(buf.read()).decode("utf-8")}), status_code=200, mimetype="application/json")


@app.route(route="chi2", methods=["POST"])
def chi2_plot(req: func.HttpRequest) -> func.HttpResponse:
    data = _parse_body(req)
    try:
        df = max(1, int(data.get("df", 3)))
    except (TypeError, ValueError) as e:
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=400, mimetype="application/json")

    from scipy.stats import chi2 as sp_chi2
    x_max = sp_chi2.ppf(0.999, df=df)
    x = np.linspace(0.001, x_max, 500)
    y = sp_chi2.pdf(x, df=df)
    cv95 = sp_chi2.ppf(0.95, df=df)

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.plot(x, y, color="#ec4899", linewidth=2.5, label=f"χ²(k={df})")
    ax.fill_between(x, y, alpha=0.12, color="#ec4899")
    mask = x >= cv95
    ax.fill_between(x[mask], y[mask], alpha=0.45, color="#ec4899", label=f"Seuil 5% : χ² > {cv95:.2f}")
    ax.axvline(cv95, color="#ec4899", linewidth=1, linestyle="--")
    ax.set_xlabel("x", fontsize=12)
    ax.set_ylabel("Densité de probabilité", fontsize=12)
    ax.set_title(f"Loi du χ² — k = {df} degrés de liberté", fontsize=14, fontweight="bold")
    ax.legend(fontsize=9)
    ax.grid(True, alpha=0.3)
    ax.set_xlim(0, x_max)
    ax.set_ylim(bottom=0)
    plt.tight_layout()

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
    plt.close(fig)
    buf.seek(0)
    return func.HttpResponse(json.dumps({"image": base64.b64encode(buf.read()).decode("utf-8")}), status_code=200, mimetype="application/json")


@app.route(route="stats", methods=["POST"])
def stats(req: func.HttpRequest) -> func.HttpResponse:
    data = _parse_body(req)
    try:
        mean = float(data.get("mean", 0))
        std = float(data.get("std", 1))
    except (TypeError, ValueError) as e:
        return func.HttpResponse(
            json.dumps({"error": f"Paramètre invalide : {e}"}),
            status_code=400,
            mimetype="application/json",
        )

    if std <= 0:
        return func.HttpResponse(
            json.dumps({"error": "σ doit être strictement positif"}),
            status_code=400,
            mimetype="application/json",
        )

    result = {
        "mean": mean,
        "std": std,
        "variance": round(std ** 2, 6),
        "p_1sigma": round(norm.cdf(mean + std, mean, std) - norm.cdf(mean - std, mean, std), 6),
        "p_2sigma": round(norm.cdf(mean + 2*std, mean, std) - norm.cdf(mean - 2*std, mean, std), 6),
        "p_3sigma": round(norm.cdf(mean + 3*std, mean, std) - norm.cdf(mean - 3*std, mean, std), 6),
    }
    return func.HttpResponse(
        json.dumps(result),
        status_code=200,
        mimetype="application/json",
    )
