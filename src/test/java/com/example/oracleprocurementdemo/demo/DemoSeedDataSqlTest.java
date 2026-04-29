package com.example.oracleprocurementdemo.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import javax.sql.DataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

@SpringBootTest
class DemoSeedDataSqlTest {

    private static final String DEMO_SEED_SCRIPT = "db/demo/V100__seed_demo_data.sql";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanBeforeTest() {
        cleanDatabase();
    }

    @AfterEach
    void cleanAfterTest() {
        cleanDatabase();
    }

    @Test
    @DisplayName("Optional demo seed SQL loads successfully and is re-runnable")
    void shouldLoadDemoSeedDataSuccessfullyAndBeRerunnable() {
        loadDemoSeedData();

        assertDemoDataWasLoadedCorrectly();

        /*
         * Run the same script a second time.
         *
         * This proves the demo seed file can be reused during local demos without
         * manually cleaning the database first.
         */
        loadDemoSeedData();

        assertDemoDataWasLoadedCorrectly();
    }

    private void loadDemoSeedData() {
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setContinueOnError(false);
        populator.setSeparator(";");
        populator.addScript(new ClassPathResource(DEMO_SEED_SCRIPT));
        populator.execute(dataSource);
    }

    private void assertDemoDataWasLoadedCorrectly() {
        assertThat(countRows("SELECT COUNT(*) FROM suppliers")).isEqualTo(4);
        assertThat(countRows("SELECT COUNT(*) FROM suppliers WHERE active = 1")).isEqualTo(3);
        assertThat(countRows("SELECT COUNT(*) FROM suppliers WHERE active = 0")).isEqualTo(1);

        assertThat(countRows("SELECT COUNT(*) FROM purchase_orders")).isEqualTo(4);
        assertThat(countRows("SELECT COUNT(*) FROM purchase_order_lines")).isEqualTo(8);

        assertThat(countRows("SELECT COUNT(*) FROM purchase_orders WHERE status = 'DRAFT'")).isEqualTo(1);
        assertThat(countRows("SELECT COUNT(*) FROM purchase_orders WHERE status = 'SUBMITTED'")).isEqualTo(1);
        assertThat(countRows("SELECT COUNT(*) FROM purchase_orders WHERE status = 'APPROVED'")).isEqualTo(1);
        assertThat(countRows("SELECT COUNT(*) FROM purchase_orders WHERE status = 'CANCELLED'")).isEqualTo(1);

        assertThat(countRows("""
                SELECT COUNT(*)
                FROM purchase_orders
                WHERE order_number IN (
                    'PO-2026-1001',
                    'PO-2026-1002',
                    'PO-2026-1003',
                    'PO-2026-1004'
                )
                """)).isEqualTo(4);

        assertThat(countRows("""
                SELECT COUNT(*)
                FROM suppliers
                WHERE supplier_code IN (
                    'SUP-1001',
                    'SUP-1002',
                    'SUP-1003',
                    'SUP-1004'
                )
                """)).isEqualTo(4);

        assertThat(countRows("""
                SELECT COUNT(*)
                FROM purchase_orders purchase_order
                WHERE purchase_order.total_amount = (
                    SELECT COALESCE(SUM(purchase_order_line.line_total), 0)
                    FROM purchase_order_lines purchase_order_line
                    WHERE purchase_order_line.purchase_order_id = purchase_order.id
                )
                """)).isEqualTo(4);

        assertThat(countRows("""
                SELECT COUNT(*)
                FROM purchase_orders
                WHERE status = 'CANCELLED'
                  AND cancellation_reason IS NOT NULL
                  AND cancelled_at IS NOT NULL
                """)).isEqualTo(1);

        assertThat(countRows("""
                SELECT COUNT(*)
                FROM purchase_orders
                WHERE status <> 'CANCELLED'
                  AND cancellation_reason IS NULL
                  AND cancelled_at IS NULL
                """)).isEqualTo(3);

        assertThat(queryBigDecimal("""
                SELECT total_amount
                FROM purchase_orders
                WHERE order_number = 'PO-2026-1001'
                """)).isEqualByComparingTo(new BigDecimal("111.50"));

        assertThat(queryBigDecimal("""
                SELECT total_amount
                FROM purchase_orders
                WHERE order_number = 'PO-2026-1002'
                """)).isEqualByComparingTo(new BigDecimal("350.00"));

        assertThat(queryBigDecimal("""
                SELECT total_amount
                FROM purchase_orders
                WHERE order_number = 'PO-2026-1003'
                """)).isEqualByComparingTo(new BigDecimal("1275.00"));

        assertThat(queryBigDecimal("""
                SELECT total_amount
                FROM purchase_orders
                WHERE order_number = 'PO-2026-1004'
                """)).isEqualByComparingTo(new BigDecimal("486.00"));
    }

    private int countRows(String sql) {
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
        assertThat(count).isNotNull();
        return count;
    }

    private BigDecimal queryBigDecimal(String sql) {
        BigDecimal value = jdbcTemplate.queryForObject(sql, BigDecimal.class);
        assertThat(value).isNotNull();
        return value;
    }

    private void cleanDatabase() {
        /*
         * Intentional test-only cleanup for this isolated integration test.
         *
         * This test runs against a disposable local/demo Oracle database. The cleanup
         * below is not application logic and is not meant as production-style data handling.
         *
         * The delete order is intentional:
         * 1. purchase_order_lines
         * 2. purchase_orders
         * 3. suppliers
         *
         * Child tables must be cleared before parent tables to avoid foreign key violations.
         */
        jdbcTemplate.execute("DELETE FROM purchase_order_lines");
        jdbcTemplate.execute("DELETE FROM purchase_orders");
        jdbcTemplate.execute("DELETE FROM suppliers");
    }
}