---
title: "MLFlow"
date: 2026-01-26T22:01:52+07:00
draft: false
tags:
    - AI
    - Machine Learning

# Author
language: en
---

MLFlow is an machine learning experiment platform that provides many usable utilities for AI Engineers. During the training phase, we might want to save and monitor the training progress metrics such as number of epoch, batch loss in an epoch, train loss, learning rate, and many more hyperparameters.

The model output file are saved as a "registered" model. A registered model may contains an incremental version. Each time we use `log_model` function with `registered_model_name`, it will add the version. 

```py
mlflow.pytorch.log_model(
    model,
    artifact_path="model",
    signature=signature,
    input_example=input_example,
    registered_model_name=config.model_name if config.register_model else None,
    pip_requirements=["torch", "torchvision"]
)
```

In MLFlow, the naming convention depends on the environment. We set the ***model alias*** to `champion` to a specific model version, a sign that this version is used in production and `challenger` for staging.

We can also use plugins like triton for auto-deploy. To load the model, a function called `load_model` should be invoked. For example, if we use pytorch, we load the model like this:

```py
model_uri = f"models:/{model_name}@champion"
self.model = mlflow.pytorch.load_model(model_uri, map_location=self.device)
```

Loading the model enables us to do inference:

```py
self.model.eval()
output = self.model(tensor)
```