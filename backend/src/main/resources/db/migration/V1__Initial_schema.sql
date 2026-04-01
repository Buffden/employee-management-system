-- V1: Initial schema
-- This creates the full base schema as it existed before V2 and V3.
-- V2 adds: invite_tokens, reset_tokens, users.status, users.password nullable
-- V3 adds: refresh_tokens
--
-- uuid-ossp is required by V2 (uuid_generate_v4() in invite_tokens/reset_tokens DEFAULT)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------
-- Tables (no FKs yet due to circular dependency between department <-> employee)
-- -------------------------

CREATE TABLE IF NOT EXISTS location (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    city        VARCHAR(255) NOT NULL,
    state       VARCHAR(255) NOT NULL,
    country     VARCHAR(255) NOT NULL,
    address     VARCHAR(255),
    postal_code VARCHAR(255),
    CONSTRAINT uksahixf1v7f7xns19cbg12d946 UNIQUE (name)
);

-- department_head_id FK added after employee table exists
CREATE TABLE IF NOT EXISTS department (
    id                  UUID PRIMARY KEY,
    name                VARCHAR(255) NOT NULL,
    description         VARCHAR(255),
    budget              DOUBLE PRECISION,
    budget_utilization  DOUBLE PRECISION,
    performance_metric  DOUBLE PRECISION,
    total_employees     INTEGER,
    created_at          DATE NOT NULL,
    location_name       VARCHAR(255),
    location_id         UUID,
    department_head_id  UUID,
    CONSTRAINT uk1t68827l97cwyxo9r1u6t4p7d UNIQUE (name)
);

-- department FK and self-referential manager FK added after department table exists
CREATE TABLE IF NOT EXISTS employee (
    id                UUID PRIMARY KEY,
    first_name        VARCHAR(255) NOT NULL,
    last_name         VARCHAR(255) NOT NULL,
    email             VARCHAR(255) NOT NULL,
    designation       VARCHAR(255) NOT NULL,
    salary            DOUBLE PRECISION NOT NULL,
    work_location     VARCHAR(255) NOT NULL,
    joining_date      DATE NOT NULL,
    experience_years  INTEGER,
    phone             VARCHAR(255),
    address           VARCHAR(255),
    performance_rating DOUBLE PRECISION,
    department_id     UUID NOT NULL,
    location_id       UUID NOT NULL,
    manager_id        UUID,
    CONSTRAINT ukfopic1oh5oln2khj8eat6ino0 UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS project (
    id                 UUID PRIMARY KEY,
    name               VARCHAR(255) NOT NULL,
    description        TEXT,
    status             VARCHAR(255) NOT NULL,
    budget             DOUBLE PRECISION,
    start_date         DATE NOT NULL,
    end_date           DATE,
    department_id      UUID NOT NULL,
    project_manager_id UUID NOT NULL,
    CONSTRAINT uk3k75vvu7mevyvvb5may5lj8k7 UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS employee_project (
    employee_id   UUID NOT NULL,
    project_id    UUID NOT NULL,
    role          VARCHAR(255),
    assigned_date DATE,
    PRIMARY KEY (employee_id, project_id)
);

CREATE TABLE IF NOT EXISTS task (
    id             UUID PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    description    TEXT,
    status         VARCHAR(255) NOT NULL,
    priority       VARCHAR(255) NOT NULL,
    start_date     DATE NOT NULL,
    due_date       DATE,
    completed_date DATE,
    project_id     UUID NOT NULL,
    assigned_to_id UUID
);

-- password is NOT NULL here; V2 makes it nullable for the invite flow
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY,
    username    VARCHAR(255) NOT NULL,
    email       VARCHAR(255),
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP(6) WITHOUT TIME ZONE NOT NULL,
    last_login  TIMESTAMP(6) WITHOUT TIME ZONE,
    employee_id UUID,
    CONSTRAINT ukr43af9ap4edm43mmtq01oddj6 UNIQUE (username)
);

-- -------------------------
-- Foreign keys
-- (added after all tables exist to avoid ordering issues)
-- -------------------------

ALTER TABLE department
    ADD CONSTRAINT fk_department_location
        FOREIGN KEY (location_id) REFERENCES location(id);

ALTER TABLE department
    ADD CONSTRAINT fk_department_head
        FOREIGN KEY (department_head_id) REFERENCES employee(id);

ALTER TABLE employee
    ADD CONSTRAINT fkbejtwvg9bxus2mffsm3swj3u9
        FOREIGN KEY (department_id) REFERENCES department(id);

ALTER TABLE employee
    ADD CONSTRAINT fk_employee_location
        FOREIGN KEY (location_id) REFERENCES location(id);

ALTER TABLE employee
    ADD CONSTRAINT fk_employee_manager
        FOREIGN KEY (manager_id) REFERENCES employee(id);

ALTER TABLE project
    ADD CONSTRAINT fk_project_department
        FOREIGN KEY (department_id) REFERENCES department(id);

ALTER TABLE project
    ADD CONSTRAINT fk8cgiutdhborp9l7pmywq7kmbq
        FOREIGN KEY (project_manager_id) REFERENCES employee(id);

ALTER TABLE employee_project
    ADD CONSTRAINT fkb25s5hgggo6k4au4sye7teb3a
        FOREIGN KEY (employee_id) REFERENCES employee(id);

ALTER TABLE employee_project
    ADD CONSTRAINT fk4yddvnm7283a40plkcti66wv9
        FOREIGN KEY (project_id) REFERENCES project(id);

ALTER TABLE task
    ADD CONSTRAINT fkk8qrwowg31kx7hp93sru1pdqa
        FOREIGN KEY (project_id) REFERENCES project(id);

ALTER TABLE task
    ADD CONSTRAINT fkgcg2pj4bhlyayhynkqigx2yeb
        FOREIGN KEY (assigned_to_id) REFERENCES employee(id);

ALTER TABLE users
    ADD CONSTRAINT fkfndbe67uw6silwqnlyudtwqmo
        FOREIGN KEY (employee_id) REFERENCES employee(id);
