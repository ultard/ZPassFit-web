IMAGE ?= zpassfit-web
TAG ?= latest
DOCKERFILE := Dockerfile

.PHONY: docker-build

docker-build:
	docker build -f $(DOCKERFILE) -t $(IMAGE):$(TAG) .
