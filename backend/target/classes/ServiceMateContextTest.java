package com.servicemate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import javax.sql.DataSource;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;

class ServiceMateContextTest extends AbstractIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Test
    void databaseIsConnected() throws SQLException {
        assertThat(dataSource.getConnection().isValid(1)).isTrue();
    }
}